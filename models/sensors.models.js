
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("sensors", {
		model_id: { // reference a model
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		device_id: { // reference a device id
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		ref: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		property: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		graph: {
			type: DataTypes.JSON,
			allowNull: true,
		}
	},
	{
		tableName: 'sensors',
		freezeTableName: true
	})
}

