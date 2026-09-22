// 回転グリル暗号の見本

const GrilleSamples = Object.freeze([
  Object.freeze({
    id: 'book',
    nameKey: 'sample.book',
    key: '241143322',
    direction: 'cw',
    plain: 'HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY',
    cipher: 'TDHOAA PYHPEH UNFYAS MFNROH OLTIII NLMGYT'
  }),
  Object.freeze({
    id: 'sandorf',
    nameKey: 'sample.sandorf',
    key: '213324231',
    direction: 'cw',
    plain: 'HAZRXEIRGNOHALEDECNADNEPEDNILRUOPESSAMNETNOREVELESSUOTETSEIRTEDZERREVNESUONSUOVEUQLANGISREIMERPUATERPTSETUOT',
    cipher: [
      'IHNALZ ARNURO ODXHNP AEEEIL SPESDR EEDGNC',
      'ZAEMEN TRVREE ESTLEV ENNIOS ERSSUR TOEEDT',
      'RUIOPN MTQSSL EEUART NOUPVG OUITSE ARTUEE'
    ].join('\n'),
    original: "Tout est prêt. Au premier signal que vous nous enverrez de Trieste, tous se lèveront en masse pour l'indépendance de la Hongrie. Xrzah.",
    noteKey: 'sample.sandorf.note'
  }),
  Object.freeze({
    id: 'short',
    nameKey: 'sample.short',
    key: '241143322',
    direction: 'cw',
    plain: 'ATTACK AT DAWN',
    cipher: 'XAAXWT TNXAXX XXXCXX XXXXXK ATXDXX XXXXXX'
  })
]);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrilleSamples;
}
