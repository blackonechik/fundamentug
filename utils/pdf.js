const { buildCommercialDocument } = require('./documents');

function buildPdfBuffer(input) {
  if (input && input.documentType) {
    return buildCommercialDocument(input.documentType, input.context || {});
  }

  return buildCommercialDocument('demo_estimate', { estimate: input });
}

module.exports = { buildPdfBuffer };
