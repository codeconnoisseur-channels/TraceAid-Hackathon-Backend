// engagementController.js

const Campaign = require('../models/campaignModel');
const Engagement = require('../models/engagementModel');


exports.toggleEngagement = async (req, res) => {
    const { campaignId, actionType } = req.params;
    
    const userId = req.user.id; 
    const userType = req.user.userType;

    if (!['like', 'save'].includes(actionType)) {
        return res.status(400).json({ success: false, message: 'Invalid action type. Must be "like" or "save".' });
    }

    const counterField = `${actionType}Count`; 

    try {
        const filter = { userId, userType, actionType, campaign: campaignId };
        const existingEngagement = await Engagement.findOne(filter);
        
        let updateCampaign;
        let isEngaged;
        let message;

        if (existingEngagement) {
            await Engagement.deleteOne(filter);
            updateCampaign = { $inc: { [counterField]: -1 } };
            isEngaged = false;
            message = `Campaign successfully un-${actionType}d.`;
        } else {
            await Engagement.create(filter);
            updateCampaign = { $inc: { [counterField]: 1 } };
            isEngaged = true;
            message = `Campaign successfully ${actionType}d.`;
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            campaignId, 
            updateCampaign, 
            { new: true, select: counterField }
        );

        if (!updatedCampaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found.' });
        }

        res.status(200).json({ 
            success: true, 
            message, 
            isEngaged, 
            [counterField]: updatedCampaign[counterField] 
        });

    } catch (error) {
        console.error(`Error toggling ${actionType}:`, error);
        res.status(500).json({ success: false, message: `Error processing ${actionType} action.` });
    }
};