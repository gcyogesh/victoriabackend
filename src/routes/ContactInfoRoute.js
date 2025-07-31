
import { saveContactInfo, getContactInfo, deleteContactInfo } from '../controllers/ContactInfoController.js';
import express from 'express'



const router = express.Router();

router.post('/', saveContactInfo);  
router.get('/', getContactInfo);       
router.delete('/:id', deleteContactInfo);   

export default router;