const { getAllBarber } = require('../model/Barber');
const Service = require('../model/Service');

const getCatalog = async (req, res) => {
    try {
        const [barbers, services] = await Promise.all([
            getAllBarber(),
            Service.getAllServices()
        ]);

        res.json({ barbers, services });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
};

module.exports = {
    getCatalog
};
