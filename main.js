import { Command } from 'commander';
import fs from 'node:fs';
import http from 'node:http';

const program = new Command();

program.helpOption('--help', 'показати довідку');

program.requiredOption('-i, --input <path>', 'шлях до файлу даних');
program.requiredOption('-p, --port <number>', 'порт сервера');
program.requiredOption('-h, --host <address>', 'адреса сервера');
program.option('-o, --output <path>', 'файл для запису відповіді');

program.parse();
const options = program.opts();

function sendResponse(res, status, text) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(text);
}

function sendJson(res, status, body) {
    const text = JSON.stringify(body);

    if (!options.output) {
        sendResponse(res, status, text);
        return;
    }

    fs.writeFile(options.output, text, (err) => {
        if (err) {
            sendResponse(res, 500, JSON.stringify({ error: 'Помилка запису у файл' }));
            return;
        }

        sendResponse(res, status, text);
    });
}
// колбек (err)=>{} викликає node.js, віддали функцію в fs.access("Коли перевіриш, викличи це"); файл є -> err є null файл знайдено, файлу немає -> є помилка, process.exit(1)
fs.access(options.input, (err) => { //викликаємо функцію fs.access і передаємо два аргументи(шлях до файлу options.input i функцію колбек(буде викликана коли перевіриться файл))
    if (err) {
        console.error('Cannot find input file');
        process.exit(1);
    }

    const server = http.createServer((req, res) => {

        let url;
        try {
            url = new URL('http://localhost' + req.url);
        } catch (e) {
            sendJson(res, 400, { error: 'Некоректний запит' });
            return;
        }

        if (url.pathname !== '/') {
            sendJson(res, 404, { error: 'Маршрут не знайдено' });
            return;
        }

        const showMfo = url.searchParams.get('mfo') === 'true';
        const onlyNormal = url.searchParams.get('normal') === 'true';

        function toNumber(value) {
            if (typeof value === 'number') {
                return Number.isFinite(value) ? value : null;
            }

            if (typeof value === 'string' && value.trim() !== '') {
                const n = Number(value);
                return Number.isFinite(n) ? n : null;
            }

            return null;
        }

        function toText(value) {
            if (typeof value === 'string' && value.trim() !== '') {
                return value;
            }

            return null;
        }

        fs.readFile(options.input, 'utf8', (err, text) => {
            if (err) {
                sendJson(res, 500, { error: 'Помилка читання файлу' });
                return;
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                sendJson(res, 500, { error: 'Помилка розбору даних' });
                return;
            }

            if (!Array.isArray(data)) {
                sendJson(res, 500, { error: 'Дані мають неочікуваний формат' });
                return;
            }

            let result;
            try {
                let records = data;

                if (onlyNormal) {
                    records = records.filter((record) => toNumber(record?.COD_STATE) === 1);
                }

                result = records.map((record) => {
                    const item = {};
                    if (showMfo) {
                        item.mfo_code = toNumber(record?.MFO);
                    }
                    item.name = toText(record?.SHORTNAME);
                    item.state_code = toNumber(record?.COD_STATE);
                    return item;
                });
            } catch (e) {
                sendJson(res, 500, { error: 'Помилка обробки даних' });
                return;
            }

            sendJson(res, 200, result);

        });

    });


    server.listen(Number(options.port), options.host, () => {
        console.log(`Сервер: http://${options.host}:${options.port}`);
    });
});
