module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: DataTypes.STRING
  });

  User.associate = function(models) {
    User.belongsToMany(models.Game, {
      through: 'usergame'
    });
  };

  return User;
};
