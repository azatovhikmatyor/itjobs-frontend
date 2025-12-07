import { Job } from '../types';

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    date: '2023-10-25',
    job_title: 'Senior Frontend Engineer',
    company: 'TechFlow Solutions',
    logo_url: 'https://picsum.photos/50/50?random=1',
    country: 'USA',
    location: 'San Francisco, CA (Remote)',
    skills: ['React', 'TypeScript', 'Tailwind', 'Performance Optimization'],
    salary: '$140k - $180k',
    source: 'Glassdoor',
    job_link: '#',
    description: 'We are looking for a Senior Frontend Engineer to lead our UI architecture. You will work with React, TypeScript, and modern build tools. Experience with AI integration is a plus.'
  },
  {
    id: '2',
    date: '2023-10-24',
    job_title: 'AI Solutions Architect',
    company: 'Nebula AI',
    logo_url: 'https://picsum.photos/50/50?random=2',
    country: 'UK',
    location: 'London',
    skills: ['Python', 'LLMs', 'RAG', 'LangChain', 'PostgreSQL'],
    salary: '£90k - £120k',
    source: 'Indeed',
    job_link: '#',
    description: 'Join Nebula AI to build the next generation of enterprise agents. You will design RAG pipelines and orchestrate multi-agent systems using LangGraph.'
  },
  {
    id: '3',
    date: '2023-10-26',
    job_title: 'Full Stack Developer',
    company: 'GreenEnergy Corp',
    logo_url: 'https://picsum.photos/50/50?random=3',
    country: 'Germany',
    location: 'Berlin',
    skills: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
    salary: '€70k - €95k',
    source: 'LinkedIn',
    job_link: '#',
    description: 'Help us build sustainable energy management dashboards. Full stack responsibility from database design to UI implementation.'
  },
  {
    id: '4',
    date: '2023-10-23',
    job_title: 'Product Designer',
    company: 'Creative Box',
    logo_url: 'https://picsum.photos/50/50?random=4',
    country: 'Canada',
    location: 'Toronto',
    skills: ['Figma', 'UX Research', 'Prototyping', 'Design Systems'],
    salary: '$90k - $110k CAD',
    source: 'Glassdoor',
    job_link: '#',
    description: 'We need a visionary Product Designer to shape the future of our creative tools suite.'
  },
  {
    id: '5',
    date: '2023-10-27',
    job_title: 'DevOps Engineer',
    company: 'ScaleUp Inc',
    logo_url: 'https://picsum.photos/50/50?random=5',
    country: 'USA',
    location: 'Austin, TX',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
    salary: '$130k - $160k',
    source: 'BuiltIn',
    job_link: '#',
    description: 'Scale our infrastructure to handle millions of requests. Expertise in AWS and Kubernetes is mandatory.'
  }
];