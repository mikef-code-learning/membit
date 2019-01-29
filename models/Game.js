module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define("Game", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guid: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  Game.associate = function(models) {
    Game.belongsToMany(models.User, {
      through: 'usergame'
    });
  };

  return Game;
};
