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
        imageSelector: 'a img'
    },
    {
        url: 'https://fotocarrete.com/categoria-producto/pelicula/35-mm/',
        productSelector: '.product',
        titleSelector: '.woocommerce-loop-product__title',
        priceSelector: '.woocommerce-Price-amount.amount bdi',
        imageSelector: '.product-image img'
    }
];

// Ruta principal para servir un archivo HTML estático
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

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
                    if (imagen && !imagen.startsWith('http')) {
                        imagen = `https://www.revelab.es${imagen}`;
                    }

                    resultados.push({
                        url: site.url,
                        titulo,
                        precio,
                        imagen: imagen ? imagen : null
                    });

                    console.log(`Imagen añadida para ${site.url}: ${imagen}`);
                });

                console.log(`Scraping completado para ${site.url}`);
            } catch (error) {
                console.error(`Error al scrapear ${site.url}:`, error.message);
                throw error;
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

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
