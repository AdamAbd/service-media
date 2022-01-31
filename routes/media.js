const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');

const { Media } = require('../models');

router.get('/', async(req, res) => {
    const media = await Media.findAll({
        attributes: ['id', 'image'],
    });

    const mappedMedia = media.map((m) => {
        m.image = `${req.get('host')}/${m.image}`;

        return m;
    })

    return res.json({
        status: 200,
        message: 'Success',
        data: mappedMedia
    });
});

router.post('/', (req, res) => {
    const image = req.body.image;

    if (!isBase64(image, { mimeRequired: true })) {
        return res.status(400).json({
            status: 400,
            message: 'invalid base64',
        });
    }

    base64Img.img(image, './public/images', Date.now(), async(err, filepath) => {
        if (err) {
            return res.status(400).json({
                status: 400,
                message: err.message,
            });
        }

        const fileName = filepath.split('/').pop();

        const media = await Media.create({ image: `images/${fileName}` });

        return res.json({
            status: 200,
            message: 'Success',
            data: {
                id: media.id,
                image: `${req.get('host')}/images/${fileName}`
            }
        });
    });
});

router.delete('/:id', async(req, res) => {
    const id = req.params.id;

    const media = await Media.findByPk(id);

    if (!media) {
        return res.status(400).json({
            status: 400,
            message: 'Media Not Found',
        });
    }

    fs.unlink(`./public/${media.image}`, async(err) => {
        if (err) {
            return res.status(400).json({
                status: 400,
                message: err,
            });
        }

        await media.destroy();

        return res.json({
            status: 200,
            message: 'Success',
        });
    });
});

module.exports = router;