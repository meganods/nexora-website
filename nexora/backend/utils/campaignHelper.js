const SaleCampaign = require('../models/SaleCampaign');

async function applyCampaignDiscounts(servicesOrPackages, isPackage = false) {
  try {
    const now = new Date();
    // Find all active running campaigns
    const activeCampaigns = await SaleCampaign.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).lean();

    if (activeCampaigns.length === 0) return servicesOrPackages;

    const isArray = Array.isArray(servicesOrPackages);
    const items = isArray ? servicesOrPackages : [servicesOrPackages];

    const updatedItems = items.map(item => {
      if (!item) return item;
      const itemObj = typeof item.toObject === 'function' ? item.toObject() : JSON.parse(JSON.stringify(item));
      
      // Find campaign that applies to this item
      let maxCampaignDiscount = 0;
      
      activeCampaigns.forEach(camp => {
        let applies = false;
        
        // Empty scope (both categories and services empty) applies to all items
        const hasNoApplicableCategories = !camp.applicableCategories || camp.applicableCategories.length === 0;
        const hasNoApplicableServices = !camp.applicableServices || camp.applicableServices.length === 0;
        
        if (hasNoApplicableCategories && hasNoApplicableServices) {
          applies = true;
        } else {
          if (isPackage) {
            // Check categories of the package
            const catIds = (itemObj.categoryIds || []).map(c => c._id?.toString() || c.toString());
            const catMatch = camp.applicableCategories?.some(cid => catIds.includes(cid.toString()));
            if (catMatch) applies = true;
          } else {
            // Check category or service of the service
            const serviceIdStr = itemObj._id?.toString();
            const categoryIdStr = itemObj.categoryId?._id?.toString() || itemObj.categoryId?.toString();
            
            const serviceMatch = camp.applicableServices?.some(sid => sid.toString() === serviceIdStr);
            const categoryMatch = camp.applicableCategories?.some(cid => cid.toString() === categoryIdStr);
            
            if (serviceMatch || categoryMatch) applies = true;
          }
        }
        
        if (applies && camp.discountPercentage > maxCampaignDiscount) {
          maxCampaignDiscount = camp.discountPercentage;
        }
      });

      if (maxCampaignDiscount > (itemObj.discountPercentage || 0)) {
        itemObj.discountPercentage = maxCampaignDiscount;
        itemObj.campaignDiscountApplied = true;
      }
      
      return itemObj;
    });

    return isArray ? updatedItems : updatedItems[0];
  } catch (err) {
    console.error('Error applying campaign discounts:', err);
    return servicesOrPackages;
  }
}

module.exports = applyCampaignDiscounts;
