const router = require("express").Router();
const uploads = require("../utils/multer"); // use uploads.array("evidenceFiles", 6)
const { authenticate, isFundraiser } = require("../middleware/auth"); // fundraiser must be logged in
const { uploadMilestone, uploadMilestoneEvidence, addMilestone } = require("../controller/milestoneController");


router.post("/milestone/add-milestone", authenticate, isFundraiser, addMilestone)


router.post("/milestones/upload-milestone", uploadMilestone)


router.post("/milestones/:milestoneId/evidence", authenticate, uploads.array("evidenceFiles", 6), uploadMilestoneEvidence);



module.exports = router;