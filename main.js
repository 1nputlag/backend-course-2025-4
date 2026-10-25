import { Command } from 'commander';
import fs from 'node:fs';

const program = new Command();

program.helpOption('--help', 'показати довідку');

program.requiredOption('-i, --input <path>', 'шлях до файлу даних');
program.requiredOption('-p, --port <number>', 'порт сервера');
program.requiredOption('-h, --host <address>', 'адреса сервера');
program.option('-o, --output <path>', 'файл для запису відповіді');

program.parse();
const options = program.opts();

fs.access(options.input ,(err) => { //викликаємо функцію fs.access і передаємо два аргументи(шлях до файлу options.input i функцію колбек(буде викликана коли перевіриться файл))
  if (err) {
    console.error('Cannot find input file');
    process.exit(1);
  }

  console.log('Файл знайдено');
});

console.log(program.opts());
  