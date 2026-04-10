import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiInstance: GoogleGenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.aiInstance = new GoogleGenAI({ apiKey });
    } else {
      this.logger.error('GEMINI_API_KEY is not set. AI task suggestions will return mock data.');
      // this.logger.error('GEMINI_API_KEY is missing from .env! AI features will not work.');
    }
  }

  async suggestTasks(projectName: string, description?: string) {
    if (!this.aiInstance) {
      // throw new InternalServerErrorException(
      //   'AI Service is not configured. Please ensure GEMINI_API_KEY is set in your .env file and the backend server has been restarted!'
      // );
      // Mocked response when no key
      return [
        { title: 'Define Requirements', description: 'Gather and document all project requirements.' },
        { title: 'Setup Development Environment', description: 'Initialize the repository and configure tools.' },
        { title: 'Create UI Mockups', description: 'Design screens for the initial flow.' },
        { title: 'Implement Core Features', description: 'Develop the main application functionality based on requirements.' },
        { title: 'Testing and QA', description: 'Perform thorough testing to ensure quality before release.' }
      ];
    }

    try {
      const prompt = `
You are an expert project manager. A user is creating a new project named "${projectName}".
${description ? `The specific project description and goals are: "${description}"` : 'However, no description was provided.'}

Your task is to break down this project into 5-7 logical starting tasks. 
CRITICAL RULE: DO NOT provide generic Software Development Life Cycle (SDLC) tasks like "Define Requirements", "Setup Environment", or "Testing" UNLESS they are specifically relevant to the description provided. 
Instead, deeply analyze the project description and provide highly specific, actionable, and contextual tasks tailored precisely to what the user wants to build or accomplish.

Format your response as a JSON array of objects. 
Each object should have two keys: "title" (a short, actionable task name) and "description" (a brief 1-sentence explanation of what to do). 
Make the tasks realistic and specific to the project context.
Ensure the output is strictly valid JSON without markdown wrapping. For example:
[
  { "title": "...", "description": "..." }
]
`;

      const response = await this.aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      // Try to parse the JSON response
      let cleanedText = responseText;
      if (cleanedText.startsWith('```json')) {
         cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
         cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const tasks = JSON.parse(cleanedText);
      return tasks;
    } catch (error) {
      this.logger.error('Error generating AI tasks', error);
      // throw new InternalServerErrorException('Failed to generate task suggestions from Gemini API. Please check your API key and connection.');
      // Fallback to mock data if the API call fails
      return [
        { title: 'Define Requirements', description: 'Gather and document all project requirements.' },
        { title: 'Setup Development Environment', description: 'Initialize the repository and configure tools.' }
      ];
    }
  }
}
