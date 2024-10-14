export default interface Command {
  name: string;
  description: string;
  options?: CommandOption[];
}
