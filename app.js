import axios from 'axios';
import * as cheerio  from 'cheerio';
import express from 'express';
import  cors  from 'cors';
const app = express();
app.use(express.json());
app.use(cors());


const port = process.env.PORT || 5000;
app.get('/',async (req, res) => {
    const url = 'https://www.flashscore.mobi/?d=-1';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const mdsoup = $('#score-data');
    
        mdsoup.find('h4').remove();
    
        const fullres = [];
    
        mdsoup.find('> span').each((index, element) => {
            try {
                const $element = $(element);
                let matchObj = {};
    
                // Check for postponed status
                if ($element.find('span.status.postponed').length > 0) {
                    matchObj.status = 'PS';
                    return; // Skip further processing for postponed matches
                }
    
                matchObj.time = $element.text().trim();
                
                let matchName = '';
                let node = element.nextSibling;
                let hasRedCard = false;
                while (node && (node.type === 'text' || (node.type === 'tag' && node.name === 'img'))) {
                    if (node.type === 'text') {
                        matchName += node.data;
                    } else if (node.name === 'img') {
                        hasRedCard = true;
                    }
                    node = node.nextSibling;
                }
                matchName = matchName.trim().replace(/^"|"$/g, '');
    
                const parts = matchName.split(' - ');
                matchObj.home = parts[0];
                matchObj.away = parts[1];
                
                if (hasRedCard) {
                    matchObj.redCard = true;
                }
    
                const $resultTag = $element.nextAll('a').first();
                matchObj.result = $resultTag.text().trim();
    
                // Determine status based on 'a' tag class
                if ($resultTag.hasClass('sched')) {
                    matchObj.status = 'NS';
                } else if ($resultTag.hasClass('fin')) {
                    matchObj.status = 'FT';
                } else if ($resultTag.hasClass('live')) {
                    matchObj.status = 'ON';
                }
    
                fullres.push(matchObj);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: error });
            }
        });
        // res.json(fullres);
        res.status(200).json({ message: fullres });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

app.listen(port, () => {
    //enjoy
    console.log(`Server is running on port ${port} 🚀`);
});