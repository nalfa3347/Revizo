import { IDataProvider } from '../contracts/IDataProvider';
import { Course, CourseConcept, Subject } from '../types';

export class CourseService {
  constructor(private dataProvider: IDataProvider) {}

  async getAllCourses(subjectId?: string): Promise<Course[]> {
    return this.dataProvider.getCourses(subjectId);
  }

  async getCourse(id: string): Promise<Course | null> {
    return this.dataProvider.getCourseById(id);
  }

  async getSubjects(): Promise<Subject[]> {
    return this.dataProvider.getSubjects();
  }

  async getConcepts(courseId: string): Promise<CourseConcept[]> {
    return this.dataProvider.getConceptsByCourseId(courseId);
  }

  async getWeakConcepts(): Promise<CourseConcept[]> {
    return this.dataProvider.getWeakConcepts();
  }

  async createCourseFromUpload(title: string, subjectId: string, fileName: string, fileSize: number): Promise<Course> {
    const subjects = await this.dataProvider.getSubjects();
    const subject = subjects.find(s => s.id === subjectId);
    return this.dataProvider.createCourse({
      title,
      subjectId,
      subjectName: subject ? subject.name : 'Général',
      originalDocumentName: fileName,
      fileSize,
      summary: 'Traitement pédagogique effectué avec succès.'
    });
  }
}
