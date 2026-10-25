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

function sendJson(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
}
// колбек (err)=>{} викликає node.js, віддали функцію в fs.access("Коли перевіриш, викличи це"); файл є -> err є null файл знайдено, файлу немає -> є помилка, process.exit(1)
fs.access(options.input, (err) => { //викликаємо функцію fs.access і передаємо два аргументи(шлях до файлу options.input i функцію колбек(буде викликана коли перевіриться файл))
    if (err) {
        console.error('Cannot find input file');
        process.exit(1);
    }

    const server = http.createServer((req, res) => {

        const url = new URL(req.url, 'http://localhost');

        if (url.pathname !== '/') {
            sendJson(res, 404, { error: 'Маршрут не знайдено' });
            return;
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

            sendJson(res, 200, { count: data.length });

        });

    });


    server.listen(Number(options.port), options.host, () => {
        console.log(`Сервер: http://${options.host}:${options.port}`);
    });
});
