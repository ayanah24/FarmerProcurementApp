const { z } = require('zod');
const prisma = require('../config/db');

const farmerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  village: z.string().min(1, 'Village is required'),
  landArea: z.coerce.number().positive('Land area must be a positive number'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
});

// Auto-generate a unique farmer code: F-XXXXX
const generateFarmerCode = async () => {
  const count = await prisma.farmer.count();
  return `F-${String(count + 1001).padStart(5, '0')}`;
};

exports.registerFarmer = async (req, res) => {
  try {
    const data = farmerSchema.parse(req.body);
    const farmerCode = await generateFarmerCode();
    const farmer = await prisma.farmer.create({ data: { ...data, farmerCode } });
    res.status(201).json(farmer);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating farmer' });
  }
};

exports.getAllFarmers = async (req, res) => {
  const farmers = await prisma.farmer.findMany();
  res.json(farmers);
};

exports.verifyFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await prisma.farmer.update({
      where: { id },
      data: { isVerified: true }
    });
    res.json(farmer);
  } catch (error) {
    res.status(400).json({ message: 'Error verifying farmer' });
  }
};
