exports.up = (pgm) => {
  pgm.createTable("verification_codes", {
    verification_code_id: "id",
    code: {
      type: "VARCHAR(10)",
      notNull: true,
    },
    created_at: {
      type: "TIMESTAMP",
      notNull: true
    },
    valid_to: {
      type: "TIMESTAMP",
      notNull: true
    }
  });
  pgm.createIndex("verification_codes", ["code"]);
};

exports.down = (pgm) => {
  pgm.dropIndex("verification_codes", ["code"]);
  pgm.dropTable("verification_codes");
};
