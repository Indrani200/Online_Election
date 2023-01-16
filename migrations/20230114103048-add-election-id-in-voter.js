'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
      await queryInterface.addColumn("Voters", "electionID", {
        type: Sequelize.DataTypes.INTEGER,
      });
  
      await queryInterface.addConstraint("Voters", {
        fields: ["electionID"],
        type: "foreign key",
        references: {
          table: "elections",
          field: "id",
        },
      });
      
    },
  
    async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn("Voters", "electionID");
      
    },
};