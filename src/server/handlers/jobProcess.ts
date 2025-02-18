import { Configuration, OpenAIApi } from 'openai';
import { logger } from '../../utils/logger';

const jobPostingSchema = {
  title: 'string',
  company: 'string',
  location: 'string',
  requirements: ['string'],
  responsibilities: ['string'],
  skills: ['string'],
  experience: 'string',
  education: 'string'
};

export async function jobProcessHandler(content: string) {
  logger.info('Processing job description');
  
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `Convert this job description to JSON following this schema: ${JSON.stringify(jobPostingSchema)}\n\nJob Description:\n${content}`;

  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  const result = JSON.parse(completion.data.choices[0].message?.content || '{}');
  logger.info('Job processing completed', { result });
  
  return result;
}
