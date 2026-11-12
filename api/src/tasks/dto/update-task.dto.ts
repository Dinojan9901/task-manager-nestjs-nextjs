import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TaskStatus } from '../task-status.enum.js';
import { trim } from './trim.transform.js';

/**
 * Body of PATCH /tasks/:id. Every field is optional.
 * - A field that is not sent keeps its current value.
 * - description and dueDate can be cleared by sending null.
 * - title can be left out, but it can never be null or empty.
 */
export class UpdateTaskDto {
  // Validate only when title is present (null is still validated and rejected).
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString({ strict: true })
  dueDate?: string | null;
}
