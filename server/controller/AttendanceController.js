const Attendance = require('../models/AttendanceModel');
const User = require('../models/UserModel');
const PDFDocument = require('pdfkit');

exports.getAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(`${year}-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await Attendance.find({
      date: { $gte: start, $lt: end }
    }).populate('user', 'name email');

    res.json({ data: records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadAttendancePDF = async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(`${year}-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await Attendance.find({
      date: { $gte: start, $lt: end }
    }).populate('user', 'name email');

    // PDF generation
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${month}_${year}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text(`Attendance Report - ${month}/${year}`, { align: 'center' });
    doc.moveDown();

    // Table header
    doc.fontSize(12).text('Name', 50, doc.y, { continued: true });
    doc.text('Email', 150, doc.y, { continued: true });
    doc.text('Date', 300, doc.y, { continued: true });
    doc.text('Start', 380, doc.y, { continued: true });
    doc.text('End', 440, doc.y, { continued: true });
    doc.text('Duration (hrs)', 500, doc.y);
    doc.moveDown();

    // Table rows
    records.forEach(r => {
      doc.text(r.user.name, 50, doc.y, { continued: true });
      doc.text(r.user.email, 150, doc.y, { continued: true });
      doc.text(r.date.toISOString().slice(0, 10), 300, doc.y, { continued: true });
      doc.text(r.startTime, 380, doc.y, { continued: true });
      doc.text(r.endTime, 440, doc.y, { continued: true });
      doc.text(r.duration.toFixed(2), 500, doc.y);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
