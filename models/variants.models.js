
module.exports = (sequelize,DataTypes)=>{
	return sequelize.define("variants", {
		name: {
			type: DataTypes.STRING,
			unique: true
		},
		model_id: {
			type: DataTypes.INTEGER,
			references: {
				model: 'models',
				key: 'id'
			}
		},
		description: {
			type: DataTypes.STRING
		},
	},
	{
		tableName: 'variants',
		freezeTableName: true
	})
}
