exports.up = (pgm) => {
  pgm.createTable("quarantines", {
    quarantine_id: "id",
    offender_user_id: {
      type: "integer",
      notNull: true,
      references: "users"
    },
    moderator_user_id: {
      type: "integer",
      notNull: true,
      references: "users"
    },
    reason: {
      type: "citext"
    },
    created_at: {
      type: "timestamp",
      notNull: true
    }
  });
  pgm.createIndex("quarantines", ["offender_user_id"]);
  pgm.createIndex("quarantines", ["moderator_user_id"]);
};

exports.down = (pgm) => {
  pgm.dropIndex("quarantines", ["offender_user_id"]);
  pgm.dropIndex("quarantines", ["moderator_user_id"]);
  pgm.dropTable("quarantines");
};
