const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

const urls = [
    {
        url: 'https://www.revelab.es/tienda/fotografia-analogica/',
        productSelector: '.product',  // Selector para cada producto en la tienda
        titleSelector: '.entry-title a',  // Selector para el título del producto
        priceSelector: '.woocommerce-Price-amount.amount bdi',  // Selector para el precio del producto
        imageSelector: 'a img'  // Selector para la imagen del producto
    },
    {
        url: 'https://fotocarrete.com/categoria-producto/pelicula/35-mm/',
        productSelector: '.product',  // Selector para cada producto en la tienda
        titleSelector: '.woocommerce-loop-product__title',  // Selector para el título del producto
        priceSelector: '.woocommerce-Price-amount.amount bdi',  // Selector para el precio del producto
        imageSelector: '.product-image img'  // Selector para la imagen del producto
    }
];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');  
});

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
                    const imagen = $(element).find(site.imageSelector).attr('data-src') || $(element).find(site.imageSelector).attr('src');  // Obtener la URL de la imagen

                    resultados.push({
                        url: site.url,
                        titulo,
                        precio,
                        imagen  // Asegurarse de incluir la imagen en los resultados
                    });
                });

                console.log(`Scraping completado para ${site.url}`);
            } catch (error) {
                console.error(`Error al scrapear ${site.url}: ${error.message}`);
            }
        };

        // Ejecutar la función para scrapear productos
        await Promise.all(urls.map(scrapeProducts));

        console.log('Scraping completado para todos los sitios.');

        res.json(resultados);
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).send('Ocurrió un error al realizar el scraping');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
