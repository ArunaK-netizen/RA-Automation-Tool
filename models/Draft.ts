import mongoose, { Schema, model, models } from 'mongoose';

const AllocationSchema = new Schema({
    raName: String,
    empId: String,
    phdRegNo: String,
    numLabsReq: Number,
    registeredSlots: String,
    courseCode: String,
    courseTitle: String,
    courseOwner: String,
    classId: String,
    roomNumber: String,
    slot: String,
    employeeName: String,
    employeeSchool: String,
    courseMode: String,
    courseType: String,
    comments: String,
});

const DraftSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for the draft.'],
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    allocations: [AllocationSchema],
    unallocatedLabs: [AllocationSchema],
    slotMap: {
        type: Map,
        of: String,
    },
});

const Draft = models.Draft || model('Draft', DraftSchema);

export default Draft;
