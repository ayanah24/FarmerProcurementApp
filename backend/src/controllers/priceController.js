const prisma = require('../config/db');

exports.setPrice = async (req, res) => {
  try {
    const { cropId, grade, ratePerQuintal } = req.body;

    // Start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const price = await prisma.priceBoard.upsert({
      where: {
        date_cropId_grade: {
          date: today,
          cropId,
          grade
        }
      },
      update: { ratePerQuintal },
      create: {
        date: today,
        cropId,
        grade,
        ratePerQuintal
      }
    });
    res.json(price);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTodaysPrices = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prices = await prisma.priceBoard.findMany({
    where: { date: today },
    include: { crop: true }
  });
  res.json(prices);
};

exports.createCrop = async (req, res) => {
  try {
    const { name } = req.body;
    const crop = await prisma.crop.create({ data: { name } });
    res.json(crop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCrops = async (req, res) => {
  const crops = await prisma.crop.findMany();
  res.json(crops);
};
