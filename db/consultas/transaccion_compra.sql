DO $$
DECLARE
    v_id_compra INTEGER;
    v_id_proveedor INTEGER := 1;
    v_id_empleado INTEGER := 1;
    v_total NUMERIC(12,2);
BEGIN

    INSERT INTO compra_insumo (id_proveedor, id_empleado, fecha, total, observaciones)
    VALUES (v_id_proveedor, v_id_empleado, NOW(), 0, 'Reabastecimiento semanal de carnes')
    RETURNING id_compra_insumo INTO v_id_compra;

    INSERT INTO compra_insumo_detalle (id_compra_insumo, id_insumo, cantidad, costo_unitario)
    VALUES
        (v_id_compra, 1, 10000.000, 0.0650),
        (v_id_compra, 2, 8000.000, 0.0580),
        (v_id_compra, 3, 4000.000, 0.0720);

    UPDATE insumo SET stock_actual = stock_actual + 10000.000 WHERE id_insumo = 1;
    UPDATE insumo SET stock_actual = stock_actual + 8000.000 WHERE id_insumo = 2;
    UPDATE insumo SET stock_actual = stock_actual + 4000.000 WHERE id_insumo = 3;

    SELECT SUM(cantidad * costo_unitario)
    INTO v_total
    FROM compra_insumo_detalle
    WHERE id_compra_insumo = v_id_compra;

    UPDATE compra_insumo
    SET total = v_total
    WHERE id_compra_insumo = v_id_compra;

    INSERT INTO movimiento_inventario (id_insumo, id_empleado, id_compra_insumo, tipo, cantidad, motivo, fecha)
    VALUES
        (1, v_id_empleado, v_id_compra, 'entrada', 10000, 'Compra semanal - carne de res', NOW()),
        (2, v_id_empleado, v_id_compra, 'entrada', 8000, 'Compra semanal - cerdo al pastor', NOW()),
        (3, v_id_empleado, v_id_compra, 'entrada', 4000, 'Compra semanal - chorizo', NOW());

    RAISE NOTICE 'Compra #% registrada exitosamente. Total: Q%', v_id_compra, v_total;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'ROLLBACK: insumo o proveedor no existe. Detalle: %', SQLERRM;

    WHEN check_violation THEN
        RAISE EXCEPTION 'ROLLBACK: valor invalido (cantidad o costo fuera de rango). Detalle: %', SQLERRM;

    WHEN unique_violation THEN
        RAISE EXCEPTION 'ROLLBACK: insumo duplicado en el detalle de compra. Detalle: %', SQLERRM;

    WHEN OTHERS THEN
        RAISE EXCEPTION 'ROLLBACK: error inesperado. Detalle: %', SQLERRM;
END;
$$;
