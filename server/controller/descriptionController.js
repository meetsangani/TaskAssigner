const Description = require('../models/DescriptionModel');

exports.addDescription = async (req, res) => {
  try {
    const newDescription = new Description({
      title: req.body.title,
      description: req.body.description,
      user: req.body.user,
    });
    await newDescription.save();
    res.status(201).json(newDescription);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

exports.getDescriptions = async (req, res) => {
  try {
    const descriptions = await Description.find();
    res.status(200).json(descriptions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};