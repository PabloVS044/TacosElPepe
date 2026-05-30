const compraInsumoService = require('../services/compraInsumoService');
const { withRoleCall } = require('../utils/transaction');

async function createCompraInsumo(req, res) {
  // Usa withRoleCall (sin BEGIN) porque el stored procedure sp_registrar_compra_insumo
  // gestiona su propia transacción con COMMIT/ROLLBACK explícitos vía CALL.
  const result = await withRoleCall(req.session.user, (client) => (
    compraInsumoService.createCompraInsumo(client, req.body, req.session.user)
  ));
  res.status(201).json(result);
}

module.exports = {
  createCompraInsumo,
};
