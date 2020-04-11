exports.up = (pgm) => {
  pgm.createType("punishment_type", ["BAN", "MUTE", "WARN", "NOTE"]);
};

exports.down = (pgm) => {
  pgm.dropType("punishment_type");
};
