'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class election extends Model {
    static addElection({ ElectionName, adminID }) {
      return this.create({ElectionName,adminID,
      });
    }

    static getElections(adminID) {
      return this.findAll({
        where: {
          adminID,
        },
        order: [["id", "ASC"]],
      });
    }

    static getElection(id) {
      return this.findOne({
        where: {
          id,
        },
      });
    }
    
    static Launchelection(id) {
      return this.update(
        {
          running: true,
        },
        {
          returning: true,
          where: {
            id,
          },
        }
      );
    }
    static associate(models) {
      // define association here
      election.belongsTo(models.Admin, {
        foreignKey: "adminID",
      });

      election.hasMany(models.Questions, {
        foreignKey: "electionID",
      });

      election.hasMany(models.Voter, {
        foreignKey: "electionID",
      });
    }
  }
  election.init({
    ElectionName: {
      type:DataTypes.STRING,
      allowNull:false,
    },
    Running:{
      type:  DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'election',
  });
  return election;
};