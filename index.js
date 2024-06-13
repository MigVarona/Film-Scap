const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Configuración de CORS
const corsOptions = {
    origin: 'http://localhost:5500',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Definición de URLs a scrapear
const urls = [
    {
        url: 'https://www.revelab.es/tienda/fotografia-analogica/',
        productSelector: '.product',
        titleSelector: '.entry-title a',
        priceSelector: '.woocommerce-Price-amount.amount bdi',
        imageSelector: 'a img',
        baseUrl: 'https://www.revelab.es'
    },
    {
        url: 'https://fotocarrete.com/categoria-producto/pelicula/35-mm/',
        productSelector: '.product',
        titleSelector: '.woocommerce-loop-product__title',
        priceSelector: '.woocommerce-Price-amount.amount bdi',
        imageSelector: '.product-image img',
        baseUrl: 'https://fotocarrete.com'
    }
];

// Ruta principal para servir un archivo HTML estático
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Función para obtener la URL completa de la imagen
const getFullImageUrl = (baseUrl, imageUrl) => {
    if (imageUrl && !imageUrl.startsWith('http')) {
        return `${baseUrl}${imageUrl}`;
    }
    return imageUrl;
};

// Ruta para realizar scraping y devolver los resultados como JSON
app.get('/scrape', async (req, res) => {
    try {
        let resultados = [];

        const scrapeProducts = async (site) => {
            try {
                const { data } = await axios.get(site.url);
                const $ = cheerio.load(data);

                $(site.productSelector).each((index, element) => {
                    const titulo = $(element).find(site.titleSelector).text().trim();
                    const precio = $(element).find(site.priceSelector).text().trim();
                    let imagen = $(element).find(site.imageSelector).attr('data-src') || $(element).find(site.imageSelector).attr('src');

                    // Ajustar la URL de la imagen si es relativa
                    imagen = getFullImageUrl(site.baseUrl, imagen);

                    resultados.push({
                        url: site.url,
                        titulo,
                        precio,
                        imagen: imagen ? `/proxy?url=${encodeURIComponent(imagen)}` : null
                    });

                    console.log(`Imagen añadida para ${site.url}: ${imagen}`);
                });

                console.log(`Scraping completado para ${site.url}`);
            } catch (error) {
                console.error(`Error al scrapear ${site.url}:`, error.message);
            }
        };

        // Ejecuta la función de scraping para todas las URLs
        await Promise.all(urls.map(scrapeProducts));

        console.log('Scraping completado para todos los sitios.');

        res.json(resultados);  // Devuelve los resultados como JSON
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).send('Ocurrió un error al realizar el scraping');
    }
});

// Ruta proxy para imágenes
app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        res.setHeader('Content-Type', contentType);
        res.send(response.data);
    } catch (error) {
        console.error('Error al obtener la imagen:', error.message);
        res.status(500).send('Ocurrió un error al obtener la imagen');
    }
});

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
