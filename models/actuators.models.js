module.exports = (sequelize,DataTypes)=>{
  return sequelize.define("actuators", {
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'models',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'devices',
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
      type: DataTypes.TEXT,
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
    tableName: 'actuators',
    freezeTableName: true
  })
}