module.exports = (sequelize,DataTypes)=>{
  return sequelize.define("actuatorsTemplate", {
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'models',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    ref: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('set', 'switch', 'number', 'text', 'json'),
      allowNull: false
    },
    property: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    graph: {
      type: DataTypes.JSON,
      allowNull: true
    },
  },
  {
    tableName: 'actuatorsTemplate',
    freezeTableName: true
  })
}