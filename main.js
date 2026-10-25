import {Command} from 'commander';

const program = new Command();

program.helpOption('--help', 'показати довідку');

program.requiredOption('-i, --input <path>', 'шлях до файлу даних');
program.requiredOption('-p, --port <number>', 'порт сервера');
program.requiredOption('-h, --host <address>', 'адреса сервера');
program.option('-o, --output <path>', 'файл для запису відповіді');

program.parse();

console.log(program.opts());
  