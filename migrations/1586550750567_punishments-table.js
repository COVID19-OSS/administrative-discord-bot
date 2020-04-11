exports.up = (pgm) => {
  pgm.createTable("punishments", {
    punishment_id: "id",
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
    punishment_type: {
      type: "punishment_type",
      notNull: true
    },
    active: {
      type: "boolean",
      notNull: true
    },
    created_at: {
      type: "timestamp",
      notNull: true
    },
    expires_at: {
      type: "timestamp"
    }
  });
  pgm.createIndex("punishments", ["offender_user_id"]);
  pgm.createIndex("punishments", ["moderator_user_id"]);
  pgm.createIndex("punishments", ["active"]);
};

exports.down = (pgm) => {
  pgm.dropIndex("punishments", ["active"]);
  pgm.dropIndex("punishments", ["offender_user_id"]);
  pgm.dropIndex("punishments", ["moderator_user_id"]);
  pgm.dropTable("punishments");
};
