const { Video } = require('../models');
const path = require('path');

const toFilePath = (file) => (file ? `/uploads/videos/${file.filename}` : null);

const createOrUpdateVideo = async (req, res) => {
  try {
    const { title, subtitle1_label, subtitle2_label, audio1_label, audio2_label } = req.body;

    // Asumir que solo hay un video, actualizar el primero o crear si no existe
    let video = await Video.findOne();
    let videoData;

    if (video) {
      videoData = {
        title: title || video.title || 'Home Video',
        video_path: req.files.video ? toFilePath(req.files.video[0]) : video.video_path,
        audio1_path: req.files.audio1 ? toFilePath(req.files.audio1[0]) : video.audio1_path,
        audio2_path: req.files.audio2 ? toFilePath(req.files.audio2[0]) : video.audio2_path,
        subtitle1_path: req.files.subtitle1 ? toFilePath(req.files.subtitle1[0]) : video.subtitle1_path,
        subtitle2_path: req.files.subtitle2 ? toFilePath(req.files.subtitle2[0]) : video.subtitle2_path,
        subtitle1_label: subtitle1_label || video.subtitle1_label || 'Subtítulos 1',
        subtitle2_label: subtitle2_label || video.subtitle2_label || 'Subtítulos 2',
        audio1_label: audio1_label || video.audio1_label || 'Audio 1',
        audio2_label: audio2_label || video.audio2_label || 'Audio 2'
      };
      await video.update(videoData);
    } else {
      videoData = {
        title: title || 'Home Video',
        video_path: toFilePath(req.files.video ? req.files.video[0] : null),
        audio1_path: toFilePath(req.files.audio1 ? req.files.audio1[0] : null),
        audio2_path: toFilePath(req.files.audio2 ? req.files.audio2[0] : null),
        subtitle1_path: toFilePath(req.files.subtitle1 ? req.files.subtitle1[0] : null),
        subtitle2_path: toFilePath(req.files.subtitle2 ? req.files.subtitle2[0] : null),
        subtitle1_label: subtitle1_label || 'Subtítulos 1',
        subtitle2_label: subtitle2_label || 'Subtítulos 2',
        audio1_label: audio1_label || 'Audio 1',
        audio2_label: audio2_label || 'Audio 2'
      };
      video = await Video.create(videoData);
    }

    res.status(200).json({ message: 'Video guardado exitosamente', video });
  } catch (error) {
    console.error('Error saving video:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const getVideo = async (req, res) => {
  try {
    const video = await Video.findOne();
    if (!video) {
      return res.status(404).json({ message: 'No video found' });
    }
    // Construir URLs completas
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const videoData = {
      ...video.toJSON(),
      video_path: video.video_path ? `${baseUrl}${video.video_path}` : null,
      audio1_path: video.audio1_path ? `${baseUrl}${video.audio1_path}` : null,
      audio2_path: video.audio2_path ? `${baseUrl}${video.audio2_path}` : null,
      subtitle1_path: video.subtitle1_path ? `${baseUrl}${video.subtitle1_path}` : null,
      subtitle2_path: video.subtitle2_path ? `${baseUrl}${video.subtitle2_path}` : null
    };
    res.json(videoData);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  createOrUpdateVideo,
  getVideo
};