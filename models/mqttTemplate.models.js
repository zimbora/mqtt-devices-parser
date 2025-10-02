
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("mqttTemplate", {
		topic: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.JSON,
			allowNull: false
		},
		defaultData: {
			type: DataTypes.JSON,
			allowNull: true	
		},
		readInterval: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		template_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
	},
	{
		tableName: 'mqttTemplate',
		freezeTableName: true
	})
}
