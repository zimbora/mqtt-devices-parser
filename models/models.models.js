
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("models", {
		name: {
			type: DataTypes.STRING,
			unique: true
		},
		description: {
			type: DataTypes.STRING
		},
		model_table: { // deprecated
			type: DataTypes.STRING,
			allowNull: true
		},
		logs_table: { // deprecated
			type: DataTypes.STRING,
			allowNull: true
		},
		fw_enabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		ar_enabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		alarms_enabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		js_code_enabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	},
	{
		tableName: 'models',
		freezeTableName: true
	})
}
