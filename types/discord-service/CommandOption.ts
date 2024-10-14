export default interface CommandOption {
  name: string;
  type: ApplicationCommandOptionType;
  description: string;
  required: boolean;
  choices?: { name: string; value: string }[];
}
