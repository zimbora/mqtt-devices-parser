module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("logs_actuators", {
      device_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'devices',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      actuator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'actuators',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      value: {
        type: DataTypes.STRING,
        allowNull: true
      },
      error: {
        type: DataTypes.STRING,
        allowNull: true
      },
      confirmed: {
      	type: DataTypes.BOOLEAN,
      	default: false,
        allowNull: false
      }
	},
	{
		tableName: 'logs_actuators',
		freezeTableName: true
	})
}

