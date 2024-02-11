import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { CommandExecutor } from "../../core/executor/command.executor";
import { IStreamLogger } from "../../core/handlers/stream-logger.interface";
import { PromptService } from "../../core/prompt/prompt.service";
import { FileService } from "../../core/files/file.service";
import { ICommandExecFfmpeg, IFfmpegInput } from "./ffmpeg.types";
import { StreamHandler } from "../../core/handlers/stream.handler";
import { FfmpegBuilder } from "./ffmpeg.builder";

export class FfmpegExecutor extends CommandExecutor<IFfmpegInput> {
  private fileService: FileService = new FileService();
  private promptService: PromptService = new PromptService();

  constructor(logger: IStreamLogger) {
    super(logger);
  }

  protected override async prompt(): Promise<IFfmpegInput> {
    const width = await this.promptService.input<number>('Ширина', 'number');
    const height = await this.promptService.input<number>('Высота', 'number');
    const path = await this.promptService.input<string>('Путь до файла', 'input');
    const name = await this.promptService.input<string>('Имя файла', 'input');
    return { width, height, path, name };
  }

  protected override build({width, height, path, name}: IFfmpegInput): ICommandExecFfmpeg {
    const output = this.fileService.getFilePath(path, name, 'mp4');
    const args = (new FfmpegBuilder())
      .input(path)
      .setVideoSize(width, height)
      .output(output);
    return {command:'ffmpeg', args, output};
  }

  protected override spawn({command, args, output}: ICommandExecFfmpeg): ChildProcessWithoutNullStreams {
    this.fileService.deleteFileIfExist(output);
    return spawn(command, args);
  }

  protected override processStream(stream: ChildProcessWithoutNullStreams, logger: IStreamLogger): void {
    const handler = new StreamHandler(logger);
    handler.processOutput(stream);
  }
}