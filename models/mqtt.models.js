
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("mqtt", {
		device_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
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
		remoteData: {
			type: DataTypes.JSON,
			allowNull: true	
		},
		localData: {
			type: DataTypes.JSON,
			allowNull: true	
		},
		readInterval: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		template_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
		}
	},
	{
		tableName: 'mqtt',
		freezeTableName: true
	})
}
