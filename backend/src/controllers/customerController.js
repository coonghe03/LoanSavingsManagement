const Customer = require('../models/Customer');
const generateId = require('../utils/generateId');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { isDeleted: false };

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, nic, mobile, email, address, notes, status } = req.body;

    if (!name || !nic || !mobile || !address) {
      return res.status(400).json({ message: 'Name, NIC, Mobile and Address are required' });
    }

    // Check duplicate NIC
    const existingNIC = await Customer.findOne({ nic, isDeleted: false });
    if (existingNIC) {
      return res.status(400).json({ message: 'NIC already exists' });
    }

    // Generate Customer ID
    const count = await Customer.countDocuments();
    const customerId = generateId('CUS', count);

    const customer = await Customer.create({
      customerId,
      name,
      nic,
      mobile,
      email: email || null,
      address,
      notes: notes || '',
      status: status || 'Active',
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { name, nic, mobile, email, address, notes, status } = req.body;

    // Check NIC uniqueness if changed
    if (nic && nic !== customer.nic) {
      const existingNIC = await Customer.findOne({ nic, isDeleted: false });
      if (existingNIC) {
        return res.status(400).json({ message: 'NIC already exists' });
      }
    }

    customer.name = name || customer.name;
    customer.nic = nic || customer.nic;
    customer.mobile = mobile || customer.mobile;
    customer.email = email !== undefined ? email : customer.email;
    customer.address = address || customer.address;
    customer.notes = notes !== undefined ? notes : customer.notes;
    customer.status = status || customer.status;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Soft delete customer
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.isDeleted = true;
    customer.status = 'Inactive';
    await customer.save();

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};