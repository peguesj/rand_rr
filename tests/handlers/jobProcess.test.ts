import { jobProcessHandler } from '../../src/server/handlers/jobProcess';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn().mockImplementation(() => ({
    createChatCompletion: jest.fn().mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              title: "Software Engineer",
              company: "Test Corp",
              location: "Remote",
              requirements: ["JavaScript", "Node.js"],
              responsibilities: ["Coding", "Testing"],
              skills: ["JavaScript", "Node.js"],
              experience: "3+ years",
              education: "Bachelor's degree"
            })
          }
        }]
      }
    })
  }))
}));

describe('jobProcessHandler', () => {
  const jobDescription = fs.readFileSync(
    path.join(__dirname, '../../src/data/default_jobPosting.json'),
    'utf8'
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process job description and return structured data', async () => {
    const result = await jobProcessHandler(jobDescription);
    
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('company');
    expect(result).toHaveProperty('requirements');
    expect(Array.isArray(result.requirements)).toBeTruthy();
    expect(Array.isArray(result.skills)).toBeTruthy();
  });
});
