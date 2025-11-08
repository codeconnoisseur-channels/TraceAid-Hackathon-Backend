const router = require("express").Router();
const uploads = require("../utils/multer"); // use uploads.array("evidenceFiles", 6)
const { authenticate, isFundraiser } = require("../middleware/auth"); // fundraiser must be logged in
const {
  uploadMilestone,
  uploadMilestoneEvidence,
  addMilestone,
  getMilestoneAchieved,
  getCampaignMilestones,
} = require("../controller/milestoneController");

router.post("/milestone/add-milestone", authenticate, isFundraiser, addMilestone);

router.post("/milestones/upload-milestone", uploadMilestone);

router.post("/milestones/evidence/:id", authenticate, uploads.array("evidenceFiles", 10), uploadMilestoneEvidence);

router.get("/get-milestone-achieved", authenticate, isFundraiser, getMilestoneAchieved);

router.get("/campaigns/milestones/:id", authenticate, isFundraiser, getCampaignMilestones);

module.exports = router;
