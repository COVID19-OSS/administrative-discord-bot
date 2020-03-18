exports.up = (pgm) => {
  pgm.createTable("users", {
    user_id: "id",
    discord_id: {
      type: "varchar(30)",
      notNull: true
    },
    created_at: {
      type: "timestamp",
      notNull: true
    }
  });
  pgm.createIndex("users", ["discord_id"], { unique: true });
};

exports.down = (pgm) => {
  pgm.dropIndex("users", ["discord_id"], { unique: true });
  pgm.dropTable("users");
};
