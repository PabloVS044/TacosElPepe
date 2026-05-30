BEGIN;

-- ============================================================
-- SP 1: sp_crear_pedido
-- Inserta pedido, pago, items y modificaciones en un bloque
-- atómico. Parámetros OUT demuestran retorno de valores y el
-- bloque EXCEPTION maneja errores con rollback implícito.
-- ============================================================
CREATE OR REPLACE FUNCTION sp_crear_pedido(
    IN  p_cliente_id     INT,
    IN  p_cajero_id      INT,
    IN  p_canal          tipo_canal_pedido,
    IN  p_estado         tipo_estado_pedido,
    IN  p_subtotal       NUMERIC,
    IN  p_total          NUMERIC,
    IN  p_notas          TEXT,
    IN  p_fecha_aprobado TIMESTAMPTZ,
    IN  p_metodo_pago    tipo_metodo_pago,
    IN  p_estado_pago    tipo_estado_pago,
    IN  p_fecha_pago     TIMESTAMPTZ,
    IN  p_items          JSONB,
    OUT o_id_pedido      INT,
    OUT o_total          NUMERIC
)
LANGUAGE plpgsql AS $$
DECLARE
    i                INT;
    j                INT;
    v_n_items        INT;
    v_n_mods         INT;
    v_item           JSONB;
    v_mod            JSONB;
    v_id_pedido_item INT;
BEGIN
    INSERT INTO pedido (
        id_cliente, id_cajero, canal, estado,
        subtotal, total, notas, fecha_aprobado
    ) VALUES (
        p_cliente_id, p_cajero_id, p_canal, p_estado,
        p_subtotal, p_total, p_notas, p_fecha_aprobado
    ) RETURNING id_pedido, total INTO o_id_pedido, o_total;

    INSERT INTO pago (id_pedido, metodo, estado, monto, fecha_confirmacion)
    VALUES (o_id_pedido, p_metodo_pago, p_estado_pago, p_total, p_fecha_pago);

    v_n_items := jsonb_array_length(p_items);
    FOR i IN 0 .. v_n_items - 1 LOOP
        v_item := p_items->i;

        INSERT INTO pedido_item (
            id_pedido, id_producto, cantidad, precio_unitario, subtotal_linea
        ) VALUES (
            o_id_pedido,
            (v_item->>'id_producto')::INT,
            (v_item->>'cantidad')::INT,
            (v_item->>'precio_unitario')::NUMERIC,
            (v_item->>'subtotal_linea')::NUMERIC
        ) RETURNING id_pedido_item INTO v_id_pedido_item;

        IF (v_item->'modificaciones') IS NOT NULL
           AND jsonb_array_length(v_item->'modificaciones') > 0 THEN
            v_n_mods := jsonb_array_length(v_item->'modificaciones');
            FOR j IN 0 .. v_n_mods - 1 LOOP
                v_mod := (v_item->'modificaciones')->j;
                INSERT INTO pedido_item_modificacion (
                    id_pedido_item, id_extra, tipo, descripcion, precio_extra
                ) VALUES (
                    v_id_pedido_item,
                    (v_mod->>'id_extra')::INT,
                    (v_mod->>'tipo')::tipo_modificacion,
                    v_mod->>'descripcion',
                    COALESCE((v_mod->>'precio_extra')::NUMERIC, 0)
                );
            END LOOP;
        END IF;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'sp_crear_pedido: error al registrar pedido — %', SQLERRM;
END;
$$;


-- ============================================================
-- SP 2: sp_descontar_stock_pedido
-- Descuenta inventario y registra movimientos de salida para
-- todos los insumos consumidos por un pedido.
-- ============================================================
CREATE OR REPLACE FUNCTION sp_descontar_stock_pedido(
    IN p_id_pedido   INT,
    IN p_actor_id    INT,
    IN p_movimientos JSONB
) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    i     INT;
    v_n   INT;
    v_mov JSONB;
BEGIN
    v_n := jsonb_array_length(p_movimientos);
    FOR i IN 0 .. v_n - 1 LOOP
        v_mov := p_movimientos->i;

        UPDATE insumo
        SET stock_actual = stock_actual - (v_mov->>'cantidad')::NUMERIC
        WHERE id_insumo = (v_mov->>'id_insumo')::INT;

        INSERT INTO movimiento_inventario (
            id_insumo, id_empleado, id_pedido, id_compra_insumo,
            tipo, cantidad, motivo, fecha
        ) VALUES (
            (v_mov->>'id_insumo')::INT,
            p_actor_id,
            p_id_pedido,
            NULL,
            'salida',
            (v_mov->>'cantidad')::NUMERIC,
            'Consumo por pedido #' || p_id_pedido::TEXT,
            NOW()
        );
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'sp_descontar_stock_pedido: error — %', SQLERRM;
END;
$$;


-- ============================================================
-- SP 3: sp_registrar_compra_insumo  (STORED PROCEDURE)
-- Registra cabecera, detalle, actualiza stock e inserta
-- movimientos de entrada. Implementa control de transacción
-- EXPLÍCITO: COMMIT al confirmar y ROLLBACK cuando una regla de
-- negocio (total inconsistente) no se cumple.
--
-- Por ser PROCEDURE (no FUNCTION) puede ejecutar COMMIT/ROLLBACK.
-- Debe invocarse con CALL fuera de un bloque de transacción.
-- El parámetro INOUT devuelve el id de la compra creada.
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_registrar_compra_insumo(
    IN    p_proveedor_id  INT,
    IN    p_empleado_id   INT,
    IN    p_total         NUMERIC,
    IN    p_observaciones TEXT,
    IN    p_detalle       JSONB,
    INOUT o_id_compra     INT
)
LANGUAGE plpgsql AS $$
DECLARE
    i            INT;
    v_n          INT;
    v_item       JSONB;
    v_total_calc NUMERIC := 0;
BEGIN
    INSERT INTO compra_insumo (id_proveedor, id_empleado, fecha, total, observaciones)
    VALUES (p_proveedor_id, p_empleado_id, NOW(), p_total, p_observaciones)
    RETURNING id_compra_insumo INTO o_id_compra;

    v_n := jsonb_array_length(p_detalle);
    FOR i IN 0 .. v_n - 1 LOOP
        v_item := p_detalle->i;

        INSERT INTO compra_insumo_detalle (id_compra_insumo, id_insumo, cantidad, costo_unitario)
        VALUES (
            o_id_compra,
            (v_item->>'id_insumo')::INT,
            (v_item->>'cantidad')::NUMERIC,
            (v_item->>'costo_unitario')::NUMERIC
        );

        UPDATE insumo
        SET stock_actual = stock_actual + (v_item->>'cantidad')::NUMERIC
        WHERE id_insumo = (v_item->>'id_insumo')::INT;

        INSERT INTO movimiento_inventario (
            id_insumo, id_empleado, id_pedido, id_compra_insumo,
            tipo, cantidad, motivo, fecha
        ) VALUES (
            (v_item->>'id_insumo')::INT,
            p_empleado_id,
            NULL,
            o_id_compra,
            'entrada',
            (v_item->>'cantidad')::NUMERIC,
            'Compra de insumo #' || o_id_compra::TEXT,
            NOW()
        );

        v_total_calc := v_total_calc
            + ((v_item->>'cantidad')::NUMERIC * (v_item->>'costo_unitario')::NUMERIC);
    END LOOP;

    -- Regla de integridad: el total recibido debe coincidir con el calculado.
    -- Si no cuadra, se revierte TODA la operación con ROLLBACK explícito.
    IF round(v_total_calc, 2) <> round(p_total, 2) THEN
        ROLLBACK;
        RAISE EXCEPTION 'sp_registrar_compra_insumo: total inconsistente (recibido %, calculado %); operación revertida con ROLLBACK.',
            p_total, v_total_calc;
    END IF;

    -- Todo correcto: se confirma la transacción de forma explícita.
    COMMIT;
END;
$$;


-- ============================================================
-- SP 4: sp_cancelar_pedido
-- Restaura inventario desde movimientos registrados, actualiza
-- pago si aplica y cancela el pedido.
-- ============================================================
CREATE OR REPLACE FUNCTION sp_cancelar_pedido(
    IN p_id_pedido INT,
    IN p_actor_id  INT
) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    v_estado_pago TEXT;
    r             RECORD;
BEGIN
    SELECT estado INTO v_estado_pago
    FROM pago
    WHERE id_pedido = p_id_pedido;

    FOR r IN
        SELECT id_insumo, SUM(cantidad) AS cantidad
        FROM movimiento_inventario
        WHERE id_pedido = p_id_pedido
          AND tipo = 'salida'
        GROUP BY id_insumo
    LOOP
        UPDATE insumo
        SET stock_actual = stock_actual + r.cantidad
        WHERE id_insumo = r.id_insumo;

        INSERT INTO movimiento_inventario (
            id_insumo, id_empleado, id_pedido, id_compra_insumo,
            tipo, cantidad, motivo, fecha
        ) VALUES (
            r.id_insumo,
            p_actor_id,
            p_id_pedido,
            NULL,
            'ajuste',
            r.cantidad,
            'Restitución por cancelación del pedido #' || p_id_pedido::TEXT,
            NOW()
        );
    END LOOP;

    IF v_estado_pago = 'pagado' THEN
        UPDATE pago
        SET estado = 'reembolsado', fecha_confirmacion = NULL
        WHERE id_pedido = p_id_pedido;
    END IF;

    UPDATE pedido
    SET estado = 'cancelado'
    WHERE id_pedido = p_id_pedido;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'sp_cancelar_pedido: error — %', SQLERRM;
END;
$$;


-- ============================================================
-- SP 5: sp_cambiar_estado_pedido
-- Aplica una transición de estado (no cancelación) con los
-- campos de timestamp y empleado correspondientes al nuevo estado.
-- ============================================================
CREATE OR REPLACE FUNCTION sp_cambiar_estado_pedido(
    IN p_id_pedido    INT,
    IN p_nuevo_estado tipo_estado_pedido,
    IN p_actor_id     INT
) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    v_estado_pago TEXT;
BEGIN
    IF p_nuevo_estado = 'aprobado' THEN
        UPDATE pedido
        SET estado         = p_nuevo_estado,
            fecha_aprobado = COALESCE(fecha_aprobado, NOW()),
            id_cajero      = COALESCE(id_cajero, p_actor_id)
        WHERE id_pedido = p_id_pedido;

    ELSIF p_nuevo_estado = 'en_proceso' THEN
        UPDATE pedido
        SET estado      = p_nuevo_estado,
            id_cocinero = COALESCE(id_cocinero, p_actor_id)
        WHERE id_pedido = p_id_pedido;

    ELSIF p_nuevo_estado = 'finalizado' THEN
        UPDATE pedido
        SET estado           = p_nuevo_estado,
            fecha_finalizado = COALESCE(fecha_finalizado, NOW()),
            id_cocinero      = COALESCE(id_cocinero, p_actor_id)
        WHERE id_pedido = p_id_pedido;

    ELSIF p_nuevo_estado = 'entregado' THEN
        UPDATE pedido
        SET estado          = p_nuevo_estado,
            fecha_entregado = COALESCE(fecha_entregado, NOW())
        WHERE id_pedido = p_id_pedido;

        SELECT estado INTO v_estado_pago
        FROM pago WHERE id_pedido = p_id_pedido;

        IF v_estado_pago = 'pendiente' THEN
            UPDATE pago
            SET estado = 'pagado', fecha_confirmacion = NOW()
            WHERE id_pedido = p_id_pedido;
        END IF;

    ELSE
        UPDATE pedido SET estado = p_nuevo_estado WHERE id_pedido = p_id_pedido;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'sp_cambiar_estado_pedido: error — %', SQLERRM;
END;
$$;

COMMIT;
